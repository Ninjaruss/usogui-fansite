import { DataSource } from 'typeorm';

export interface Seeder {
  run(): Promise<void>;
}
