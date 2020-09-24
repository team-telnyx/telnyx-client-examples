import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Conference } from './conference.entity';

@Entity()
export class CallLeg {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  from!: string;

  @Column()
  to!: string;

  @Column()
  telnyxCallControlId!: string;

  @ManyToOne((type) => Conference, (conference) => conference.callLegs, {
    cascade: ['update'],
  })
  conference!: Conference;
}
