/* eslint-disable */

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Laptop } from './laptop.entity';
import { MulterModule } from '@nestjs/platform-express';
import { Image } from './image.entity';
import { Station } from './station.entity';
import { Product } from './product.entity';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        synchronize: true,
        entities: [Laptop, Image, Station, Product],
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Laptop, Image, Station, Product]),
    MulterModule.register({
      dest: './uploaded-photos',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploaded-photos'), // путь к директории с изображениями
      serveRoot: '/uploaded-photos', // префикс для доступа к изображениям
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
