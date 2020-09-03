import {
  Entity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Agent {
  @PrimaryGeneratedColumn()
  id!: string;

  @Column()
  name!: string;

  @Column()
  sipUsername!: string;

  @Column()
  loggedIn!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
