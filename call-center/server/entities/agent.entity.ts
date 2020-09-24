import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Agent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  sipUsername!: string;

  @Column()
  loggedIn!: boolean;

  @Column()
  available!: boolean;
}
