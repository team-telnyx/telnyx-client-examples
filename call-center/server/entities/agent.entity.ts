import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Call } from './call.entity';

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

  @ManyToMany((type) => Call, (call) => call.agents, {
    cascade: ['update'],
  })
  @JoinTable()
  calls!: Call[];
}
