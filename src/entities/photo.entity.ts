import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
@Entity('photo')
export class PhotoEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({
    length: 100,
  })
  name: string;
  @Column('text')
  description: string;
  @Column()
  filename: string;
  @Column('double precision')
  views: number;
  @Column()
  isPublished: boolean;
}
