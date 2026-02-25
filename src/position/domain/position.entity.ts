import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Tree,
  TreeChildren,
  TreeParent,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('position')
@Tree('materialized-path')
export class Position {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'uuid', nullable: true })
  parentId: string | null;

  @TreeParent()
  parent: Position | null;

  @TreeChildren()
  children: Position[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
