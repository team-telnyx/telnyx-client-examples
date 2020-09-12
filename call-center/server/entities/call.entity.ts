import { Entity, Column, PrimaryGeneratedColumn, ManyToMany } from 'typeorm';
import { Agent } from './agent.entity';

@Entity()
export class Call {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  callSessionId!: string;

  @Column()
  from!: string;

  @ManyToMany((type) => Agent, (agent) => agent.calls, {
    cascade: ['update'],
  })
  agents!: Agent[];
}
