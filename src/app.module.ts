import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Laptop } from './laptop.entity';
import { MulterModule } from '@nestjs/platform-express';
import { Image } from './image.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        synchronize: true,
        entities: [Laptop, Image],
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Laptop, Image]), // Add Image here
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
