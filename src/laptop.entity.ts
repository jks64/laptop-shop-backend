import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Image } from './image.entity';

@Entity()
export class Laptop {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  price: number;

  @OneToMany(() => Image, (image) => image.laptop)
  imagePaths: Image[];

  @Column()
  description: string;

  @Column()
  characteristicScreen: string;

  @Column()
  characteristicMemory: string;

  @Column()
  characteristicProcessor: string;

  @Column()
  characteristicStorage: string;

  @Column()
  characteristicGraphics: string;

  @Column()
  characteristicBatery: string;

  @CreateDateColumn()
  createdAt: Date;
}
