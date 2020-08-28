import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

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
}
