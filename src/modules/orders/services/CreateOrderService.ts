import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if(!customer){
      throw new AppError('Could not find any customer with the given id');
    }

    const checkProducts = await this.productsRepository.findAllById(products);

    if(!checkProducts.length){
      throw new AppError('Could not find any product with the given ids');
    }

    const checkProductsIds = checkProducts.map(product => product.id);

    const checkInexistentProducts = products.filter(
      product=> !checkProductsIds.includes(product.id)
    );

    if(checkInexistentProducts.length){
      throw new AppError(`Could not find product with the given ids ${checkInexistentProducts}`);
    }

    const findProductsWithNoQuantityAvailable = products.filter(
      product=>
        checkProducts.filter(
          checkedProduct=> checkedProduct.id === product.id
        )[0].quantity < product.quantity,
    );

    if(findProductsWithNoQuantityAvailable.length){
      throw new AppError(
        `Not enough quantity of product id ${findProductsWithNoQuantityAvailable[0].id}`
        );
    }

    const serializedProducts = products.map(product => ({
      product_id: product.id,
      quantity: product.quantity,
      price: checkProducts.filter(checkedProduct=> checkedProduct.id===product.id)[0].price,
    }));

    const order = await this.ordersRepository.create({
      customer,
      products: serializedProducts,
    });

    const orderedProductsQuantitys = products.map(product => ({
      id: product.id,
      quantity:
        checkProducts.filter(checkedProduct=> checkedProduct.id===product.id)[0].quantity-product.quantity,
    }));

    await this.productsRepository.updateQuantity(orderedProductsQuantitys);

    return order;
  }
}

export default CreateOrderService;
