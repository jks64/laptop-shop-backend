/* eslint-disable */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  BeforeInsert, // Добавляем импорт BeforeInsert
} from 'typeorm';
import { Product } from './product.entity';

@Entity()
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  review: string;

  @Column()
  rating: number;

  @Column({ default: false, type: 'boolean' }) // Указываем тип boolean
  confirmed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @BeforeInsert()
  updateConfirmed() {
    if (this.confirmed === undefined || this.confirmed === null) {
      this.confirmed = false;
    } else {
      this.confirmed = !!this.confirmed;
    }
  }
}
