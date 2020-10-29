import {MigrationInterface, QueryRunner, TableColumn, TableForeignKey} from "typeorm";

export default class AddCustomerIdToOrders1603813142930 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {

        //Primeiro vamos adiciar a columna customer_id na tabela orders
        await queryRunner.addColumn(
            'orders',
            new TableColumn({
                name: 'customer_id',
                type: 'uuid',
                isNullable: true,
            })
        );

        //Agora, cria-se a TableForeignKey
        await queryRunner.createForeignKey(
            'orders',
            new TableForeignKey({
                name: 'OrdersCustomer',
                columnNames: ['customer_id'],
                referencedTableName: 'customers',
                referencedColumnNames: ['id'],
                onDelete: `SET NULL`,
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropForeignKey('orders','OrdersCustomer');

        await queryRunner.dropColumn('orders','customer_id');
    }

}
