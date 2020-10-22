import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Conference } from './conference.entity';

export enum CallLegStatus {
  INACTIVE = 'inactive',
  NEW = 'new',
  ACTIVE = 'active',
}

export enum CallLegClientCallState {
  DEFAULT = 'default',
  AUTO_ANSWER = 'auto_answer',
}

export enum CallLegDirection {
  INCOMING = 'incoming',
  OUTGOING = 'outgoing',
}

@Entity()
export class CallLeg {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({
    type: 'simple-enum',
    enum: CallLegStatus,
    default: CallLegStatus.NEW,
  })
  status!: string;

  @Column({
    type: 'simple-enum',
    enum: CallLegClientCallState,
    default: CallLegClientCallState.DEFAULT,
  })
  clientCallState!: string;

  @Column()
  from!: string;

  @Column()
  to!: string;

  @Column({
    type: 'simple-enum',
    enum: CallLegDirection,
    default: CallLegDirection.INCOMING,
  })
  direction!: string;

  @Column()
  telnyxCallControlId!: string;

  @Column()
  telnyxConnectionId!: string;

  @Column()
  muted!: boolean;

  @ManyToOne((type) => Conference, (conference) => conference.callLegs, {
    cascade: ['update'],
  })
  conference!: Conference;
}
