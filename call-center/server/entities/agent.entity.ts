import {
  Entity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
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

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne((type) => Call, (call) => call.agents, {
    cascade: ['update'],
  })
  @JoinColumn()
  activeCall!: Call;
}
