import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface B2AuthResponse {
  accountId: string;
  authorizationToken: string;
  apiInfo: {
    storageApi: {
      apiUrl: string;
      downloadUrl: string;
      absoluteMinimumPartSize: number;
      recommendedPartSize: number;
      s3ApiUrl: string;
      capabilities: string[];
      bucketId: string | null;
      bucketName: string | null;
      namePrefix: string | null;
      infoType: string;
    };
  };
  applicationKeyExpirationTimestamp: number | null;
}

interface B2UploadUrlResponse {
  bucketId: string;
  uploadUrl: string;
  authorizationToken: string;
}

interface B2UploadResponse {
  fileId: string;
  fileName: string;
  accountId: string;
  bucketId: string;
  contentLength: number;
  contentType: string;
  fileInfo: Record<string, string>;
  uploadTimestamp: number;
}

@Injectable()
export class BackblazeB2Service {
  private readonly logger = new Logger(BackblazeB2Service.name);

  private authData: {
    authorizationToken: string;
    apiUrl: string;
    downloadUrl: string;
  } | null = null;
  private authExpiry: number = 0;

  constructor(private readonly configService: ConfigService) {}

  private get applicationKeyId(): string {
    const keyId = this.configService.get<string>('B2_APPLICATION_KEY_ID');
    if (!keyId) {
      throw new InternalServerErrorException(
        'B2_APPLICATION_KEY_ID not configured',
      );
    }
    return keyId;
  }

  private get applicationKey(): string {
    const key = this.configService.get<string>('B2_APPLICATION_KEY');
    if (!key) {
      throw new InternalServerErrorException(
        'B2_APPLICATION_KEY not configured',
      );
    }
    return key;
  }

  private get bucketId(): string {
    const id = this.configService.get<string>('B2_BUCKET_ID');
    if (!id) {
      throw new InternalServerErrorException('B2_BUCKET_ID not configured');
    }
    return id;
  }

  private get customDomain(): string | null {
    return this.configService.get<string>('B2_CUSTOM_DOMAIN') ?? null;
  }

  private async authorize(): Promise<{
    authorizationToken: string;
    apiUrl: string;
    downloadUrl: string;
  }> {
    const authString = Buffer.from(
      `${this.applicationKeyId}:${this.applicationKey}`,
    ).toString('base64');

    try {
      const response = await fetch(
        'https://api.backblazeb2.com/b2api/v3/b2_authorize_account',
        {
          method: 'GET',
          headers: {
            Authorization: `Basic ${authString}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `B2 authorization failed: ${response.status} ${response.statusText}`,
        );
      }

      const data = (await response.json()) as B2AuthResponse;

      // Extract the nested values from the actual B2 response structure
      const authData = {
        authorizationToken: data.authorizationToken,
        apiUrl: data.apiInfo.storageApi.apiUrl,
        downloadUrl: data.apiInfo.storageApi.downloadUrl,
      };

      // Debug logging to verify extraction
      this.logger.debug('B2 Authorization Response processed:', {
        hasAuthToken: !!authData.authorizationToken,
        hasApiUrl: !!authData.apiUrl,
        hasDownloadUrl: !!authData.downloadUrl,
        apiUrl: authData.apiUrl,
      });

      if (!authData.apiUrl) {
        this.logger.error(
          'B2 authorization response missing apiUrl field',
          data,
        );
        throw new Error('B2 authorization response missing apiUrl field');
      }

      this.authData = authData;
      this.authExpiry = Date.now() + 23 * 60 * 60 * 1000; // 23 hours

      return authData;
    } catch (error) {
      this.logger.error('Failed to authorize with Backblaze B2', error);
      throw new InternalServerErrorException(
        'Failed to authorize with Backblaze B2',
      );
    }
  }

  private async ensureAuth(): Promise<{
    authorizationToken: string;
    apiUrl: string;
    downloadUrl: string;
  }> {
    if (!this.authData || Date.now() > this.authExpiry) {
      await this.authorize();
    }
    return this.authData!;
  }

  private async getUploadUrl(): Promise<B2UploadUrlResponse> {
    const auth = await this.ensureAuth();

    if (!auth.apiUrl) {
      this.logger.error(
        'Cannot get upload URL: apiUrl is undefined in auth data',
      );
      throw new InternalServerErrorException(
        'B2 authorization data is invalid - missing apiUrl',
      );
    }

    try {
      const response = await fetch(
        `${auth.apiUrl}/b2api/v3/b2_get_upload_url`,
        {
          method: 'POST',
          headers: {
            Authorization: auth.authorizationToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bucketId: this.bucketId,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Failed to get upload URL: ${response.status} ${response.statusText}`,
          errorText,
        );
        throw new Error(
          `Failed to get upload URL: ${response.status} ${response.statusText}`,
        );
      }

      return (await response.json()) as B2UploadUrlResponse;
    } catch (error) {
      this.logger.error('Failed to get upload URL from B2', error);
      throw new InternalServerErrorException('Failed to prepare upload');
    }
  }

  private async attemptUpload(
    uploadUrl: B2UploadUrlResponse,
    file: Buffer,
    fullFileName: string,
    contentType: string,
    sha1Hash: string,
  ): Promise<B2UploadResponse> {
    const response = await fetch(uploadUrl.uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: uploadUrl.authorizationToken,
        'X-Bz-File-Name': encodeURIComponent(fullFileName),
        'Content-Type': contentType,
        'Content-Length': file.length.toString(),
        'X-Bz-Content-Sha1': sha1Hash,
      },
      body: new Uint8Array(file),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: any;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      this.logger.error(
        `B2 upload failed: ${response.status}`,
        JSON.stringify(errorData, null, 2),
      );

      // Throw with status code so we can handle retries
      const error: any = new Error(`Upload failed: ${response.status}`);
      error.status = response.status;
      error.code = errorData.code;
      throw error;
    }

    return (await response.json()) as B2UploadResponse;
  }

  async uploadFile(
    file: Buffer,
    fileName: string,
    contentType: string,
    folder: 'characters' | 'arcs' | 'media' = 'media',
  ): Promise<{ fileId: string; fileName: string; url: string; key: string }> {
    if (!file || file.length === 0) {
      throw new BadRequestException('File is required');
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.length > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    // Validate content type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(contentType)) {
      throw new BadRequestException(
        'Only image files (JPEG, PNG, WebP, GIF) are allowed',
      );
    }

    const fullFileName = `${folder}/${fileName}`;

    // Calculate SHA1 hash of the file content
    const crypto = await import('crypto');
    const sha1Hash = crypto.createHash('sha1').update(file).digest('hex');

    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Get a fresh upload URL for each attempt
        // This is important for 503 errors where the token may be expired
        const uploadUrl = await this.getUploadUrl();

        if (attempt > 0) {
          this.logger.log(
            `Retry attempt ${attempt + 1}/${maxRetries} for ${fileName}`,
          );
        }

        const uploadResult = await this.attemptUpload(
          uploadUrl,
          file,
          fullFileName,
          contentType,
          sha1Hash,
        );

        // Generate public URL
        const publicUrl = this.generatePublicUrl(uploadResult.fileName);

        this.logger.log(`Successfully uploaded ${uploadResult.fileName} to B2`);

        return {
          fileId: uploadResult.fileId,
          fileName: uploadResult.fileName,
          url: publicUrl,
          key: uploadResult.fileName, // B2 object key is the full file name/path
        };
      } catch (error: any) {
        lastError = error;

        // Check if error is retryable (503, 500, 408, or network errors)
        const isRetryable =
          error.status === 503 ||
          error.status === 500 ||
          error.status === 408 ||
          error.code === 'service_unavailable' ||
          !error.status; // Network errors

        if (!isRetryable || attempt === maxRetries - 1) {
          // Don't retry for non-retryable errors or if this was the last attempt
          break;
        }

        // Exponential backoff: 1s, 2s, 4s
        const backoffMs = Math.pow(2, attempt) * 1000;
        this.logger.warn(
          `Upload attempt ${attempt + 1} failed with ${error.status || 'network error'}, retrying in ${backoffMs}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }

    // All retries failed
    this.logger.error(
      `Failed to upload file to B2 after ${maxRetries} attempts`,
      lastError,
    );
    throw new InternalServerErrorException(
      'Failed to upload file. Please try again later.',
    );
  }

  /**
   * Safely delete file from B2, logging errors but not throwing
   */
  async safeDeleteFile(key: string): Promise<void> {
    try {
      await this.deleteFile(key);
    } catch (error) {
      this.logger.error(`Error during safe deletion of ${key} from B2`, error);
      // Don't throw - allow cleanup to continue
    }
  }

  private generatePublicUrl(fileName: string): string {
    const customDomain = this.customDomain;
    if (customDomain) {
      return `${customDomain.replace(/\/$/, '')}/${fileName}`;
    }

    const bucketName = this.configService.get<string>('B2_BUCKET_NAME');
    if (!bucketName) {
      throw new InternalServerErrorException('B2_BUCKET_NAME not configured');
    }

    return `https://f005.backblazeb2.com/file/${bucketName}/${fileName}`;
  }

  async deleteFile(fileName: string): Promise<void> {
    const auth = await this.ensureAuth();

    try {
      // First, get file info
      const listResponse = await fetch(
        `${auth.apiUrl}/b2api/v3/b2_list_file_names`,
        {
          method: 'POST',
          headers: {
            Authorization: auth.authorizationToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bucketId: this.bucketId,
            startFileName: fileName,
            maxFileCount: 1,
          }),
        },
      );

      if (!listResponse.ok) {
        throw new Error(`Failed to list files: ${listResponse.status}`);
      }

      const listData = (await listResponse.json()) as {
        files: Array<{ fileId: string; fileName: string }>;
      };
      const file = listData.files.find((f) => f.fileName === fileName);

      if (!file) {
        this.logger.warn(`File not found for deletion: ${fileName}`);
        return;
      }

      // Delete the file
      const deleteResponse = await fetch(
        `${auth.apiUrl}/b2api/v3/b2_delete_file_version`,
        {
          method: 'POST',
          headers: {
            Authorization: auth.authorizationToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileId: file.fileId,
            fileName: file.fileName,
          }),
        },
      );

      if (!deleteResponse.ok) {
        throw new Error(`Failed to delete file: ${deleteResponse.status}`);
      }

      this.logger.log(`Successfully deleted ${fileName} from B2`);
    } catch (error) {
      this.logger.error(`Failed to delete file ${fileName} from B2`, error);
      // Don't throw here as file might already be deleted
    }
  }

  generateSignedUrl(
    fileName: string,
    _expiresInSeconds: number = 3600,
  ): string {
    // For now, return the public URL since B2 files can be public
    // If you need private files, you'd implement signed URL generation here
    return this.generatePublicUrl(fileName);
  }
}
