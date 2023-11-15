import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Product } from './product.entity';
@Entity()
export class Station {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  phoneNumber?: string;

  @Column({ nullable: true })
  secondName?: string;

  @Column({ nullable: true })
  station?: string;

  @Column({ nullable: true })
  street?: string;

  @Column({ nullable: true })
  house?: string;

  @Column({ nullable: true })
  flat?: string;

  @Column({ nullable: true })
  paymentMethod?: string;

  @OneToMany(() => Product, (product) => product.laptops)
  productIDs: Product[];

  @CreateDateColumn()
  createdAt: Date;
}
