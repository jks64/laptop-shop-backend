/* eslint-disable */
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
  MiddlewareConsumer,
  Module,
  NestModule,
  Query,
} from '@nestjs/common';
const base64ToImage = require('base64-to-image');
import { ServeStaticModule } from '@nestjs/serve-static';
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
import { JoinColumn, ManyToOne } from 'typeorm';
import axios from 'axios';
import * as https from 'follow-redirects/https';
import * as nodemailer from 'nodemailer';

const fsAny = fs as any;
var { promisify } = require('util');
const sharp = require('sharp');

var readFile = promisify(fs.readFile);
var writeFile = promisify(fs.writeFile);
let isLogin = false;
var options = {
  method: 'POST',
  hostname: 'e1gewr.api.infobip.com',
  path: '/email/3/send',
  headers: {
    Authorization:
      'App ********************************-********-****-****-****-********57d6',
    Accept: 'application/json',
  },
  maxRedirects: 20,
};
const uploadedFileNames: string[] = [];

// var options = {
//   method: 'POST',
//   hostname: 'e1gewr.api.infobip.com',
//   path: '/sms/2/text/advanced',
//   headers: {
//     Authorization:
//       '88ca8c9dc9d7ecb6ca06a7de6d2536ec-12cc85f5-ba58-4514-be60-815bd96357d6',
//     'Content-Type': 'application/json',
//     Accept: 'application/json',
//   },
//   maxRedirects: 20,
// };

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

      // Оптимизированный запрос с использованием JOIN
      const laptopsWithImages = await Promise.all(
        laptops.map(async (laptop) => {
          const images = await this.imageRepository.find({
            where: { laptopId: laptop.id, position: 0 },
          });

          const imageFiles = await Promise.all(
            images.map(async (image) => {
              const imagePath = join('uploaded-photos', image.imagePath);
              const imagePosition = image.position;
              const imageUrl = image.imageUrl;
              return { imageName: image.imagePath, imagePosition, imageUrl };
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

  // В вашем контроллере
  @Get('product/:id')
  async getLaptopWithImages(
    @Param('id') id: string,
    @Res() response: Response,
  ): Promise<any> {
    try {
      const laptop: Laptop | undefined = await this.laptopRepository.findOne({
        where: { id: Number(id) },
        // where: { id: 33 },
      });

      console.log('laptop', laptop);

      if (!laptop) {
        return response.status(404).json({ message: 'Ноутбук не найден' });
      }

      const images = await this.imageRepository.find({
        where: { laptopId: laptop.id },
      });

      const imageFiles = await Promise.all(
        images.map(async (image) => {
          const imagePath = join('uploaded-photos', image.imagePath);
          const imagePosition = image.position;
          const imageUrl = image.imageUrl;
          return { imageName: image.imagePath, imageUrl, imagePosition };
        }),
      );

      const laptopWithImages = { ...laptop, images: imageFiles };
      response.send(laptopWithImages);
    } catch (error) {
      console.error('Ошибка при получении данных о продукте ДАДАДА:', error);
      response
        .status(500)
        .json({ message: 'Ошибка при получении данных о продукте ДАДАДА' });
    }
  }

  @Get('oneImage')
  async getLaptopsWithImage(@Res() response: Response): Promise<any> {
    try {
      const laptops = await this.appService.getLaptops();

      const laptopsWithImages = await Promise.all(
        laptops.map(async (laptop) => {
          const images = await this.imageRepository.find({
            where: { laptopId: laptop.id, position: 0 },
          });
          const imageFiles = await Promise.all(
            images.map(async (image) => {
              const imagePath = path.join('uploaded-photos', image.imagePath);
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
    return this.appService.deleteLaptop(laptopId);
  }

  @Patch(':laptopId')
  @UseInterceptors(
    FilesInterceptor('image', null, {
      storage: multer.diskStorage({
        destination: (req, file, callback) => {
          callback(null, './uploaded-photos');
        },
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const modifiedFilename = uniqueSuffix + '-' + file.originalname;
          req['modifiedFilename'] = modifiedFilename;
          callback(null, modifiedFilename);
        },
      }),
    }),
  )
  async updateLaptop(
    @Param('laptopId') laptopId: number,
    @Body() laptopData,
    @Req() request: Request,
    @UploadedFiles() files,
    @Res() res: Response,
  ) {
    console.log('laptopId:', laptopData.position);
    console.log('laptopData:', laptopData);
    console.log('files:', files);

    const positions = laptopData.position

    const updatedLaptop = await this.appService.updateLaptop(
      laptopId,
      laptopData,
      positions,
      files
    );

    res.status(201).send();
    return updatedLaptop;
  }

  @Post('createorder')
  async createOrder(@Body() orderData: any, @Res() response: Response) {
    try {
      const newStation = await this.appService.createOrder(orderData);
      response.status(200).send(200);
    } catch (error) {
      console.error(error);
      response.status(500).send('Internal Server Error');
    }
  }

  @Get('getORder')
  async getOrder(@Query('orderId') orderId: any) {
    this.appService.confirmOrder(orderId);
    return 'Заказ подтвержден успешно';
  }

  @Post('email')
  async sendEmail(
    @Body('email') email: string,
    @Body('data') data: { orderId: any; paymentMethod: string },
  ): Promise<any> {
    let textToSend: string = '';
    const notebookTitles = data.orderId.products.map(
      (product) => product.title,
    );
    const notebookTitlesString = notebookTitles.join(', ');
    const productsPrice = data.orderId.products.reduce(
      (sum, product) => sum + product.price,
      0,
    );
    const confirmationLink = `https://91.239.232.14:443/laptops/getORder?orderId=${data.orderId.id}`;

    switch (data.paymentMethod) {
      case 'Наложенный платеж':
        textToSend = `
        <p>Вітаємо! Дякуємо за покупку в нашому магазині. Номер Вашого заказу #${data.orderId.id} Ваш товар: ${notebookTitlesString} ціна: ${productsPrice} наш менеджер зв'яжется з вами найблишчим часом для підтвредження замовлення. Якщо ви хочете підтвердити замовлення без зв'язку натисніть на кнопку</p>
        <a href="${confirmationLink}" style="background-color: #4CAF50; /* Зеленый цвет */
        border: none;
        color: white;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 16px;
        margin: 4px 2px;
        cursor: pointer;
        padding: 10px 20px;">Подтвердить заказ</a>
      `;
        break;
      case 'Перевод на карту':
        textToSend = `<p>Вітаємо! Дякуємо за покупку в нашому магазині. Номер Вашого заказу #${data.orderId.id} Ваш товар: ${notebookTitlesString}  Просимо оплатити суму ${productsPrice} на карту 5375 4141 0997 4393 ,
        
        пілся цього скинути квитанцію на номер +380973279521. Після Оплати ваш товар буде відправлений до кінця доби.</p>`;
        break;
      case 'На расчётный счет':
        textToSend = `<p style="white-space: pre;">Вітаємо! Дякуємо за покупку в нашому магазині. Номер Вашого заказу #${data.orderId.id} Ваш товар: ${notebookTitlesString}  Просимо оплатити суму ${productsPrice} Поповнення за реквізитами
                        Отримувач: ФОП Горобець Антон Миколайович 
                        IBAN: UA623220010000026002310108684 
                        ІПН/ЄДРПОУ: 2917318873 
                        Акціонерне товариство: УНІВЕРСАЛ БАНК 
                        МФО: 322001 
                        ЄДРПОУ Банку: 21133352, пілся цього скинути квитанцію на номер +380973279521. 
                        Після Оплати ваш товар буде відправлений до кінця доби.
                        </p>`;
        break;
    }

    let transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: {
        user: 'ltopbusiness@ltop.pro', // замените на свой адрес электронной почты
        pass: '123keygoR!', // замените на свой пароль
      },
    });

    let mailOptions = {
      from: 'ltopbusiness@ltop.pro', // замените на свой адрес электронной почты
      to: email,
      subject: 'Ltop',
      html: `${textToSend}`, // Используйте html вместо text
      // text: `${textToSend}!`,
    };

    transporter.sendMail(mailOptions, (error: any, info: any) => {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  }

  @Post('send')
  async sendSms(@Body('phoneNumber') phoneNumber: string): Promise<any> {
    const options = {
      method: 'POST',
      hostname: 'e1gewr.api.infobip.com',
      path: '/sms/2/text/advanced',
      headers: {
        Authorization:
          'App 88ca8c9dc9d7ecb6ca06a7de6d2536ec-12cc85f5-ba58-4514-be60-815bd96357d6',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      maxRedirects: 20,
    };

    const postData = {
      messages: [
        {
          destinations: [{ to: phoneNumber }],
          from: 'ServiceSMS',
          text: 'привет это компания ltop.pro ваш заказ #',
        },
      ],
    };

    try {
      const response = await axios.post(
        'https://e1gewr.api.infobip.com/sms/2/text/advanced',
        postData,
        { headers: options.headers },
      );
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Get('order')
  async getLatestOrder(@Res() response: Response) {
    try {
      const orders = await this.appService.getOrders();
      const sortedOrders = orders.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
      const lastOrder = sortedOrders[0];

      const products = await this.productRepository.find({
        where: { orderId: lastOrder.id },
      });

      const productsIds = products.map((product) => product.laptopId);
      const productsWithLaptops =
        await this.laptopRepository.findByIds(productsIds);

      const laptopsWithImages = await Promise.all(
        productsWithLaptops.map(async (laptop) => {
          const images = await this.imageRepository.find({
            where: { laptopId: laptop.id },
          });
          const imageFiles = await Promise.all(
            images.map(async (image) => {
              const imagePath = path.join('uploaded-photos', image.imagePath);
              const imageUrl = image.imageUrl;
              const imagePosition = image.position;
              return { imageUrl, imagePosition };
            }),
          );

          return { ...laptop, images: imageFiles };
        }),
      );

      const orderWithProducts = {
        ...lastOrder,
        products: laptopsWithImages,
      };

      console.log('orderWithProducts', orderWithProducts);
      response.send(orderWithProducts);
    } catch (error) {
      console.log(error);
      response.status(500).send({ message: 'Ошибка сервера' });
    }
  }

  @Get('orders')
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
      const productsIds = products.map((product) => product.laptopId);

      const productsWithLaptops =
        await this.laptopRepository.findByIds(productsIds);

      const laptopsWithImages = await Promise.all(
        productsWithLaptops.map(async (laptop) => {
          const images = await this.imageRepository.find({
            where: { laptopId: laptop.id },
          });
          const imageFiles = await Promise.all(
            images.map(async (image) => {
              const imagePath = path.join('uploaded-photos', image.imagePath);
              const imagePosition = image.position;
              const imageUrl = image.imageUrl;
              return { imageUrl, imagePosition };
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
    response.send(ordersWithProducts);
  }

  @Post()
  @UseInterceptors(
    FilesInterceptor('image', 12, {
      dest: './uploaded-photos',
      fileFilter: (req, file, callback) => {
        if (file.mimetype.startsWith('image/')) {
          callback(null, true);
        } else {
          callback(new Error('Только изображения разрешены'), false);
        }
      },
      storage: multer.diskStorage({
        destination: (req, file, callback) => {
          callback(null, './uploaded-photos');
        },
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const modifiedFilename = uniqueSuffix + '-' + file.originalname;
          req['modifiedFilename'] = modifiedFilename;
          uploadedFileNames.push(modifiedFilename);
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
    console.log('laptopData', laptopData);
    try {
      const laptop = this.laptopRepository.create({
        ...laptopData,
      });

      const savedLaptop = await this.laptopRepository.save(laptop);
      for (const [index, file] of files.entries()) {
        const modifiedFilename = request['modifiedFilename'];
        console.log('uploadedFileNames123', uploadedFileNames[index]);
        // const imageUrl = `https://91.239.232.14:443/uploaded-photos/${uploadedFileNames[index]}`;
        const imageUrl = `https://91.239.232.14:443/uploaded-photos/${file.filename}`;
        const positions = request.body['position'];
        const imagePath = path.join(file.filename);
        const laptops = await this.appService.getLaptops();
        const laptopIds = laptops.map((laptop) => laptop.id);
        const laptopIdnew = savedLaptop;
        const image = new Image();
        const position = positions;

        const ArrPos: any = Array.from(position);
        //falfa
        image.imageUrl = imageUrl;
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
        } else {
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
        const filePath = join(__dirname, '../uploaded-photos', imagePath);
        return createReadStream(filePath);
      });

      res.setHeader('Content-Type', 'image/png'); // Измените это на соответствующий MIME-тип, если это не JPEG

      fileStreams.forEach((fileStream) => fileStream.pipe(res));
    } else {
      res.status(404).json({ message: 'Изображения не найдены' });
    }
  }

  @Post('login')
  login(@Req() request: Request, @Res() response: Response) {
    const requestData = request.body;

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
