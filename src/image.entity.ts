/* eslint-disable */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Laptop } from './laptop.entity';

@Entity()
export class Image {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  imagePath: string;

  @ManyToOne(() => Laptop, (laptop) => laptop.imagePaths)
  laptop: Laptop;

  @Column()
  laptopId: number;

  @Column()
  position: number;
}
