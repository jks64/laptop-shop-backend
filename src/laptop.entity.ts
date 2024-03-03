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

  @Column({ type: 'text' })
  description: string;

  @Column()
  characteristicScreen: string;

  @Column()
  characteristicMemory: string;

  @Column({ default: false, type: 'boolean' }) // Указываем тип boolean
  inStock: boolean;

  @Column({ default: false, type: 'boolean' }) // Указываем тип boolean
  hidden: boolean;

  @Column()
  characteristicProcessor: string;

  @Column()
  characteristicStorage: string;

  @Column()
  characteristicGraphics: string;

  @Column()
  characteristicBatery: string;

  @Column({ nullable: true })
  brand: string;

  @CreateDateColumn()
  createdAt: Date;
}
