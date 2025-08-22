import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import { v4 as uuid } from 'uuid';
import * as sharp from 'sharp';

@Injectable()
export class FileUploadService {
  private s3: S3;

  constructor(private configService: ConfigService) {
    this.s3 = new S3({
      accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      region: this.configService.get('AWS_REGION'),
    });
  }

  async uploadImage(file: Express.Multer.File, folder: string): Promise<string> {
    // Process image with sharp
    const processedBuffer = await sharp(file.buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    const key = `${folder}/${uuid()}.jpg`;
    
    await this.s3.upload({
      Bucket: this.configService.get('AWS_S3_BUCKET'),
      Key: key,
      Body: processedBuffer,
      ContentType: 'image/jpeg',
      ACL: 'public-read',
    }).promise();

    return `https://${this.configService.get('AWS_S3_BUCKET')}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${key}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const key = fileUrl.split('.amazonaws.com/')[1];
    
    await this.s3.deleteObject({
      Bucket: this.configService.get('AWS_S3_BUCKET'),
      Key: key,
    }).promise();
  }

  async uploadMedia(file: Express.Multer.File, folder: string): Promise<string> {
    const key = `${folder}/${uuid()}-${file.originalname}`;
    
    await this.s3.upload({
      Bucket: this.configService.get('AWS_S3_BUCKET'),
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    }).promise();

    return `https://${this.configService.get('AWS_S3_BUCKET')}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${key}`;
  }
}
