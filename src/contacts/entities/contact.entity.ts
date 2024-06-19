import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity()
export class Contact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    nullable: true,
  })
  phoneNumber?: string;

  @Column({
    nullable: true,
  })
  email?: string;

  @Column({
    nullable: true,
  })
  linkedId?: number;

  @Column()
  linkPrecedence: 'secondary' | 'primary';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
