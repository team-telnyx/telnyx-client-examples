import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Agent } from './agent.entity';

@Entity()
export class Call {
  @PrimaryGeneratedColumn()
  id!: string;

  @Column()
  callSessionId!: string;

  @Column()
  callLegId!: string;

  @Column()
  callControlId!: string;

  @Column()
  from!: string;

  @Column()
  to!: string;

  @OneToMany((type) => Agent, (agent) => agent.activeCall, {
    cascade: ['update'],
  })
  agents!: Agent[];
}
