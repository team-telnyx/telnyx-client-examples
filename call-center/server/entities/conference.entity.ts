import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { CallLeg } from './callLeg.entity';

@Entity()
export class Conference {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  telnyxConferenceId!: string;

  @Column()
  from!: string;

  @Column()
  to!: string;

  @OneToMany((type) => CallLeg, (callLeg) => callLeg.conference, {
    cascade: ['insert', 'update'],
  })
  callLegs!: CallLeg[];
}
