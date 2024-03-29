import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Laptop } from './laptop.entity';
import { Image } from './image.entity';
import { Station } from './station.entity';
import { Product } from './product.entity';
import { Review } from './review.entity';

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
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
  ) {}

  async getAllReviews() {
    return this.reviewRepository.find();
  }

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

  async createReview(reviewData: Partial<Review>) {
    const newReview = this.reviewRepository.create(reviewData);

    await this.reviewRepository.save(newReview);
    return newReview;
  }

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

  async updateLaptopStock(laptopId: number, inStock) {
    const laptop = await this.laptopRepository.findOne({
      where: { id: laptopId },
    });
    const upedateFields = {
      inStock: inStock.inStock === true,
    };
    console.log('upedateFields', upedateFields);
    console.log('inStock', inStock.typeof);
    await this.laptopRepository.update({ id: laptop.id }, upedateFields);
    const updatedLaptop = await this.laptopRepository.findOne({
      where: { id: laptop.id },
    });
    return updatedLaptop;
  }

  async updateLaptopHidden(laptopId: number, hidden) {
    const laptop = await this.laptopRepository.findOne({
      where: { id: laptopId },
    });
    const upedateFields = {
      hidden: hidden.hidden === true,
    };
    console.log('upedateFields', upedateFields);
    console.log('hidden', hidden);
    await this.laptopRepository.update({ id: laptop.id }, upedateFields);
    const updatedLaptop = await this.laptopRepository.findOne({
      where: { id: laptop.id },
    });
    console.log(updatedLaptop);
    return updatedLaptop;
  }

  async updateConfirmed(reviewId: number, confirmed) {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
    });
    const upedateFields = {
      confirmed: confirmed.confirmed === true,
    };
    console.log('upedateFields', upedateFields);
    console.log('hidden', confirmed);
    await this.reviewRepository.update({ id: review.id }, upedateFields);
    const updatedLaptop = await this.reviewRepository.findOne({
      where: { id: review.id },
    });
    console.log(updatedLaptop);
    return updatedLaptop;
  }

  async updateLaptop(
    laptopId: number,
    laptopData,
    positions: number[],
    files: Express.Multer.File[],
  ) {
    const laptop = await this.laptopRepository.findOne({
      where: { id: laptopId },
    });

    if (!laptop) {
      return null;
    }

    const updatedFields: Partial<Laptop> = {
      title: laptopData.title,
      price: laptopData.price,
      description: laptopData.description,
      characteristicScreen: laptopData.characteristicScreen,
      characteristicMemory: laptopData.characteristicMemory,
      characteristicProcessor: laptopData.characteristicProcessor,
      characteristicStorage: laptopData.characteristicStorage,
      characteristicGraphics: laptopData.characteristicGraphics,
      characteristicBatery: laptopData.characteristicBatery,
      inStock: laptopData.inStock === 'true',
    };
    console.log('updatedFields', updatedFields);
    // console.log('laptopData', laptopData);
    // Обновление полей модели Laptop
    await this.laptopRepository.update({ id: laptop.id }, updatedFields);

    const oldImages = await this.imageRepository.find({
      where: { laptopId: laptopId },
    });
    for (let i = 0; i < oldImages.length; i++) {
      await this.imageRepository.remove(oldImages[i]);
    }

    // Проход по каждому файлу и добавление его в соответствующее место
    // console.log('newImageUrls', newImageUrls);
    const filteredFiles = files.filter((item) => typeof item === 'object');

    console.log('files', filteredFiles);
    const newImageUrls = filteredFiles.map(
      // (file) => `http://localhost:3000/uploaded-photos/${file.filename}`,
      (file) => `https://91.239.232.14:443/uploaded-photos/${file.filename}`,
    );
    console.log('newImageUrls', newImageUrls);

    const imageUrls = laptopData.imageUrl;
    console.log('imageUrls', imageUrls);
    console.log('imageUrlstype', typeof imageUrls);
    const allImageUrls = imageUrls
      ? [...imageUrls, ...newImageUrls]
      : newImageUrls;

    // console.log('allImageUrls', allImageUrls);
    function generateLaptopName() {
      const randomNumber = Math.floor(Math.random() * 1000) + 1;
      const laptopName = `laptop${randomNumber}`;
      return laptopName;
    }
    for (let i = 0; i < allImageUrls.length; i++) {
      const newImage = new Image();
      newImage.imageUrl = allImageUrls[i]; // Выберите правильный индекс из объединенного массива
      if (files && files[i]) {
        const file = files[i];
        newImage.imageUrl = allImageUrls[i];
        newImage.imagePath = file.filename;
      } else {
        newImage.imagePath = generateLaptopName();
      }
      newImage.laptop = laptop;
      newImage.position = positions[i];
      await this.imageRepository.save(newImage);
    }

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
