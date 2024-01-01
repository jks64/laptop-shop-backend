import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Laptop } from './laptop.entity';
import { Image } from './image.entity';
import { Station } from './station.entity';
import { Product } from './product.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Laptop)
    private laptopRepository: Repository<Laptop>,
    @InjectRepository(Image)
    private imageRepository: Repository<Image>,
    @InjectRepository(Station)
    private stationRepository: Repository<Station>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async getLaptops(): Promise<Laptop[]> {
    return this.laptopRepository.find();
  }

  async getOrders(): Promise<Station[]> {
    return this.stationRepository.find();
  }

  async createLaptop(laptopData: Partial<Laptop>): Promise<Laptop> {
    const newLaptop = this.laptopRepository.create(laptopData);
    await this.laptopRepository.save(newLaptop);
    return newLaptop;
  }

  // for (let i = 0; i < files.length; i++) {
  //   // console.log('fileSS');
  //   const file = files[i];
  //   imagePaths.push(file.base64Data);

  //   const newImage = new Image();
  //   newImage.imagePath = file.base64Data;
  //   newImage.laptop = laptop;
  //   newImage.position = positions[i]; // Используйте позицию из массива positions

  //   console.log('trata', newImage);

  //   await this.imageRepository.save(newImage);

  async createOrder(orderData: Partial<Station>): Promise<Station> {
    const newOrder = this.stationRepository.create(orderData);
    const products = orderData.productIDs;
    const productsId = [];
    for (let i = 0; i < products.length; i++) {
      productsId.push(products[i].id);
    }
    // console.log('orderdata', productsId);
    const newProduct = this.productRepository.create(productsId);
    console.log('newProduct', newProduct);
    console.log('newORder', newOrder);
    await this.stationRepository.save(newOrder);
    const orderId = newOrder.id; // Получите айди заказа
    await productsId.forEach((laptopId) => {
      this.productRepository.save([{ orderId: orderId, laptopId: laptopId }]);
    });
    // await this.stationRepository.save({
    //   productIDs:
    // })
    return newOrder;
  }

  async deleteLaptop(laptopId: number) {
    const deleteResult = await this.imageRepository.delete(laptopId);
    return deleteResult;
  }
  async confirmOrder(orderId: number) {
    const orderToUpdate = await this.stationRepository.findOneById(orderId);
    if (!orderToUpdate) {
      throw new Error(`Заказ с id ${orderId} не найден`);
    }

    orderToUpdate.confirmed = true;

    await this.stationRepository.save(orderToUpdate);

    return orderToUpdate;
  }

  // app.service.ts

  async updateLaptop(
    laptopId: number,
    laptopData: Partial<Laptop>,
    files: Array<any>,
    positions: number[], // Получите позиции из тела запроса
  ) {
    const laptop = await this.laptopRepository.findOne({
      where: { id: laptopId },
    });

    if (!laptop) {
      return null;
    }

    // Удаление старых изображений
    const oldImages = await this.imageRepository.find({
      where: { laptopId: laptopId },
    });
    console.log('oLx', oldImages);
    for (let i = 0; i < oldImages.length; i++) {
      await this.imageRepository.remove(oldImages[i]);
    }

    const imagePaths: string[] = [];
    console.log('BABYBAYfsdfsdfdsf', files);
    for (let i = 0; i < files.length; i++) {
      // console.log('fileSS');
      const file = files[i];
      imagePaths.push(file.base64Data);

      const newImage = new Image();
      newImage.imagePath = file.base64Data;
      newImage.laptop = laptop;
      newImage.position = positions[i]; // Используйте позицию из массива positions

      console.log('trata', newImage);

      await this.imageRepository.save(newImage);
    }
    console.log('pATH', imagePaths);
    const updatedFields = {
      title: laptopData.title,
      price: laptopData.price,
      description: laptopData.description,
      characteristicScreen: laptopData.characteristicScreen,
      characteristicMemory: laptopData.characteristicMemory,
      characteristicProcessor: laptopData.characteristicProcessor,
      characteristicStorage: laptopData.characteristicStorage,
      characteristicGraphics: laptopData.characteristicGraphics,
      // imagePaths: imagePaths, // Используйте imagePaths вместо laptopData.imagePaths
    };
    console.log('updatedFields', updatedFields);

    await this.laptopRepository.update({ id: laptop.id }, updatedFields);

    const updatedLaptop = await this.laptopRepository.findOne({
      where: { id: laptop.id },
    });

    return updatedLaptop;
  }

  async deleteImagesByLaptopId(laptopId: number) {
    const imagesToDelete = await this.imageRepository.find({
      where: { laptopId },
    });

    await this.imageRepository.remove(imagesToDelete);

    await this.laptopRepository.delete(laptopId);
  }
  async createImage(imageData: Partial<Image>): Promise<Image> {
    const newImage = this.imageRepository.create(imageData);
    console.log('imageDataCreatEimage', imageData);
    await this.imageRepository.save(newImage);
    return newImage;
  }
}
