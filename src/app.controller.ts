import {
  UseInterceptors,
  Controller,
  Get,
  Post,
  Res,
  Req,
  Param,
  Body,
  Delete,
  Patch,
  Header,
  UploadedFiles,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
const base64ToImage = require('base64-to-image');
import { AppService } from './app.service';
import { Response, Request } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Laptop } from './laptop.entity';
import * as jwt from 'jsonwebtoken';
import { promises as fs } from 'fs';
import * as path from 'path';
import { Image } from './image.entity';
import { Readable } from 'stream';
import { getConnection } from 'typeorm';
import { join } from 'path';
import * as multer from 'multer';
import { createReadStream } from 'fs';
import { Station } from './station.entity';
import { Product } from './product.entity';
const fsAny = fs as any;
var { promisify } = require('util');
const sharp = require('sharp');

var readFile = promisify(fs.readFile);
var writeFile = promisify(fs.writeFile);
let isLogin = false;

@Controller('laptops')
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectRepository(Laptop)
    private laptopRepository: Repository<Laptop>,
    @InjectRepository(Image)
    private imageRepository: Repository<Image>,
    @InjectRepository(Station)
    private stationRepository: Repository<Station>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  @Get()
  async getLaptopsWithImages(@Res() response: Response): Promise<any> {
    try {
      const laptops = await this.appService.getLaptops();

      const laptopsWithImages = await Promise.all(
        laptops.map(async (laptop) => {
          const images = await this.imageRepository.find({
            where: { laptopId: laptop.id },
          });
          const imageFiles = await Promise.all(
            images.map(async (image) => {
              const imagePath = path.join('uploaded photos', image.imagePath);
              const imageFile = await fs.readFile(imagePath);
              const imagePosition = image.position;
              return { imageFile, imagePosition };
            }),
          );

          return { ...laptop, images: imageFiles };
        }),
      );

      response.send(laptopsWithImages);
    } catch (error) {
      console.error('Ошибка при получении данных о продуктах:', error);
      response
        .status(500)
        .json({ message: 'Ошибка при получении данных о продуктах' });
    }
  }

  @Delete(':laptopId')
  async delete(@Param('laptopId') laptopId: number) {
    await this.appService.deleteImagesByLaptopId(laptopId);
    console.log(laptopId);
    return this.appService.deleteLaptop(laptopId);
  }

  @Patch(':laptopId')
  @UseInterceptors(
    FilesInterceptor('image', 6, {
      dest: './uploaded photos',
      fileFilter: (req, file, callback) => {
        if (file.mimetype.startsWith('image/')) {
          callback(null, true);
        } else {
          callback(new Error('Только изображения разрешены'), false);
        }
      },
      storage: multer.diskStorage({
        destination: (req, file, callback) => {
          callback(null, './uploaded photos');
        },
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const modifiedFilename = uniqueSuffix + '-' + file.originalname;
          callback(null, modifiedFilename);
        },
      }),
    }),
  )
  async updateLaptop(
    @Param('laptopId') laptopId: number,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() laptopData: Partial<Laptop>,
    @Body('position') positions: number[],
    @Body('image') images: string[],
  ) {
    if (files.length <= 0) {
      const path = './загруженные фотографии';
      let base64Image = images.map((ell) => ell.split(';base64,').pop());
      const fullArray = Array.from(positions);
      let filenames = [];
      const positionFileObjects = fullArray.map((position, index) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const modifiedFilename = uniqueSuffix + '-' + 'image' + '.jpeg';
        filenames.push(modifiedFilename);
        const base64Data = images[index];
        return { position: position, base64Data: modifiedFilename };
      });
      const imageBuffer = base64Image.map((base64Image) =>
        Buffer.from(base64Image, 'base64'),
      );
      for (let i = 0; i < imageBuffer.length; i++) {
        sharp(imageBuffer[i])
          .jpeg()
          .toFile(`./uploaded photos/${filenames[i]}`, (err, info) => {
            if (err) {
              console.log(err);
            } else {
              console.log(info);
            }
          });
      }

      const updatedLaptop = await this.appService.updateLaptop(
        laptopId,
        laptopData,
        positionFileObjects,
        positions,
      );
      return updatedLaptop;
    }
  }

  @Post('createorder')
  async createOrder(@Body() orderData: any, @Res() response: Response) {
    console.log(orderData);
    const newStation = await this.appService.createOrder(orderData);
    response.status(200).send(200);
  }

  @Get('orders')
  // const laptops = await this.appService.getLaptops();

  // const laptopsWithImages = await Promise.all(
  //   laptops.map(async (laptop) => {
  //     const images = await this.imageRepository.find({
  //       where: { laptopId: laptop.id },
  //     });
  async getOrders(
    @Param('laptopId') laptopId: number,
    @Res() response: Response,
  ) {
    const orders = await this.appService.getOrders();

    const ordersWithProducts: object[] = [];
    const productsByProductId = [];
    for (const order of orders) {
      const products = await this.productRepository.find({
        where: { orderId: order.id },
      });

      // Получить массив с айдишниками товаров
      const productsIds = products.map((product) => product.laptopId);

      // Найти ноутбуки по массиву с айдишниками
      const productsWithLaptops =
        await this.laptopRepository.findByIds(productsIds);

      const laptopsWithImages = await Promise.all(
        productsWithLaptops.map(async (laptop) => {
          const images = await this.imageRepository.find({
            where: { laptopId: laptop.id },
          });
          const imageFiles = await Promise.all(
            images.map(async (image) => {
              const imagePath = path.join('uploaded photos', image.imagePath);
              const imageFile = await fs.readFile(imagePath);
              const imagePosition = image.position;
              return { imageFile, imagePosition };
            }),
          );

          return { ...laptop, images: imageFiles };
        }),
      );

      const orderWithProducts = {
        ...order,
        products: laptopsWithImages,
      };

      ordersWithProducts.push(orderWithProducts);
    }

    console.log(productsByProductId);
    response.send(ordersWithProducts);
  }

  // const laptops = await this.appService.getLaptops();

  // const laptopsWithImages = await Promise.all(
  //   laptops.map(async (laptop) => {
  //     const images = await this.imageRepository.find({
  //       where: { laptopId: laptop.id },
  //     });
  //     const imageFiles = await Promise.all(
  //       images.map(async (image) => {
  //         const imagePath = path.join('uploaded photos', image.imagePath);
  //         const imageFile = await fs.readFile(imagePath);
  //         const imagePosition = image.position;
  //         return { imageFile, imagePosition };
  //       }),
  //     );

  //     return { ...laptop, images: imageFiles };
  //   }),
  // );

  @Post()
  @UseInterceptors(
    FilesInterceptor('image', 6, {
      dest: './uploaded photos',
      fileFilter: (req, file, callback) => {
        if (file.mimetype.startsWith('image/')) {
          callback(null, true);
        } else {
          callback(new Error('Только изображения разрешены'), false);
        }
      },
      storage: multer.diskStorage({
        destination: (req, file, callback) => {
          callback(null, './uploaded photos');
        },
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const modifiedFilename = uniqueSuffix + '-' + file.originalname;
          callback(null, modifiedFilename);
        },
      }),
    }),
  )
  async uploadSingle(
    @Res() response: Response,
    @UploadedFiles() files,
    @Req() request: Request,
  ) {
    const laptopData = request.body;
    console.log(laptopData);
    try {
      const laptop = this.laptopRepository.create({
        ...laptopData,
      });

      const savedLaptop = await this.laptopRepository.save(laptop);

      const positions = request.body['position'];
      console.log('FILES: : : : :: ', files);
      for (const [index, file] of files.entries()) {
        const imagePath = path.join(file.filename); // Используйте file.filename, который содержит имя  с
        const laptops = await this.appService.getLaptops();
        const laptopIds = laptops.map((laptop) => laptop.id);
        const laptopIdnew = savedLaptop;
        const image = new Image();
        const position = positions;
        const ArrPos: any = Array.from(position);
        //falfa
        image.position = ArrPos[index];

        image.imagePath = imagePath;

        const sortedLaptops = await this.laptopRepository.find({
          order: {
            createdAt: 'DESC',
          },
          take: 1, // Берем только
        });
        const lastCreatedLaptop = sortedLaptops[0];
        image.laptopId = lastCreatedLaptop.id;

        const createdImage = await this.imageRepository.create(image);
        await this.imageRepository.save(createdImage);

        if (sortedLaptops.length > 0) {
          const lastCreatedLaptop = sortedLaptops[0];
          console.log(lastCreatedLaptop.id);
        } else {
          console.log('Лептоп не был создан.');
        }
      }

      response.status(201).json(savedLaptop);
    } catch (error) {
      console.error('Ошибка при сохранении продукта:', error);
      response.status(500).json({ message: 'Ошибка при сохранении продукта' });
    }
  }

  @Get('images/:laptopId')
  async findImages(@Param('laptopId') laptopId: number, @Res() res: Response) {
    const images = await this.imageRepository.find({ where: { laptopId } });

    if (images.length > 0) {
      const imagePaths = images.map((image) => image.imagePath);
      const fileStreams = imagePaths.map((imagePath) => {
        const filePath = join(__dirname, '../uploaded photos', imagePath);
        return createReadStream(filePath);
      });

      res.setHeader('Content-Type', 'image/png'); // Измените это на соответствующий MIME-тип, если это не JPEG

      fileStreams.forEach((fileStream) => fileStream.pipe(res));
    } else {
      res.status(404).json({ message: 'Изображения не найдены' });
    }
  }

    

  @Post('login')
  login(
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const requestData =request.body;

    if (requestData.password === '123keygor') {
      isLogin = true;
      const token = jwt.sign(
        { username: requestData.username },
        'your-secret-key',
        {
          expiresIn: '1h',
        },
      );
      return response.json({
        message: 'Успех',
        data: requestData,
        token,
        isLogin,
      });
    } else {
      return response.json({ message: 'Провал', data: requestData });
    }
  }
}
