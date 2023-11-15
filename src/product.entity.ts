import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Station } from './station.entity';
@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  orderId: number;

  @Column({ nullable: true })
  laptopId: number;

  @ManyToOne(() => Station, (order) => order.productIDs)
  laptops: Station;
}
