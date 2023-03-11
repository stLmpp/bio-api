import { MAIN_INJECTOR } from '@api/core';
import { PrismaClient } from '@prisma/client';
import { ValueProvider } from '@stlmpp/di';

import { createRepository, Repository } from './repository.js';

@Repository()
export class PlatformRepository extends createRepository('platform') {}
@Repository()
export class GameRepository extends createRepository('game') {}
@Repository()
export class MiniGameRepository extends createRepository('miniGame') {}
@Repository()
export class GameMiniGameRepository extends createRepository('gameMiniGame') {}
@Repository()
export class PlatformGameMiniGameRepository extends createRepository('platformGameMiniGame') {}

MAIN_INJECTOR.register([new ValueProvider(PrismaClient, new PrismaClient())]);
