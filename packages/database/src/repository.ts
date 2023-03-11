import { MAIN_INJECTOR } from '@api/core';
import { PrismaClient } from '@prisma/client';
import { FactoryProvider } from '@stlmpp/di';
import { type Class } from 'type-fest';

const repositorySymbol = Symbol('repository');

export function createRepository<K extends keyof PrismaClient>(
  repository: K
): Class<PrismaClient[K]> {
  class CustomRepository {
    static readonly [repositorySymbol] = repository;
  }
  return CustomRepository as never;
}

export function Repository() {
  return (target: Class<unknown>) => {
    MAIN_INJECTOR.register(
      new FactoryProvider(
        target,
        (prismaClient) => {
          const key: keyof PrismaClient = (target as never)[repositorySymbol];
          return (prismaClient as PrismaClient)[key];
        },
        [PrismaClient]
      )
    );
  };
}
