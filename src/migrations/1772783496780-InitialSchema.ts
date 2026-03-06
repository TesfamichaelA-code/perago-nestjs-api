import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1772783496780 implements MigrationInterface {
    name = 'InitialSchema1772783496780'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "position" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "description" text NOT NULL, "parentId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "mpath" character varying DEFAULT '', CONSTRAINT "PK_b7f483581562b4dc62ae1a5b7e2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "position" ADD CONSTRAINT "FK_d9f8eca45b27205b3802f56149e" FOREIGN KEY ("parentId") REFERENCES "position"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "position" DROP CONSTRAINT "FK_d9f8eca45b27205b3802f56149e"`);
        await queryRunner.query(`DROP TABLE "position"`);
    }

}
