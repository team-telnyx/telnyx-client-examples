import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Conference } from './conference.entity';

export enum CallLegStatus {
  INACTIVE = 'inactive',
  ACTIVE = 'active',
}

export enum CallLegDirection {
  INCOMING = 'incoming',
  OUTGOING = 'outgoing',
}

@Entity()
export class CallLeg {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'simple-enum',
    enum: CallLegStatus,
    default: CallLegStatus.INACTIVE,
  })
  status!: string;

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
