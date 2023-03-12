// ##### AUTO-GENERATED

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
export class InputTypeRepository extends createRepository('inputType') {}
@Repository()
export class ModeRepository extends createRepository('mode') {}
@Repository()
export class StageRepository extends createRepository('stage') {}
@Repository()
export class CharacterRepository extends createRepository('character') {}
@Repository()
export class CharacterCostumeRepository extends createRepository('characterCostume') {}
@Repository()
export class GameMiniGameRepository extends createRepository('gameMiniGame') {}
@Repository()
export class PlatformGameMiniGameRepository extends createRepository('platformGameMiniGame') {}
@Repository()
export class PlatformGameMiniGameModeRepository extends createRepository('platformGameMiniGameMode') {}
@Repository()
export class PlatformGameMiniGameModeCharacterCostumeRepository extends createRepository('platformGameMiniGameModeCharacterCostume') {}
@Repository()
export class PlatformGameMiniGameModeStageRepository extends createRepository('platformGameMiniGameModeStage') {}
@Repository()
export class PlatformInputTypeRepository extends createRepository('platformInputType') {}
@Repository()
export class RegionRepository extends createRepository('region') {}
@Repository()
export class PlayerRepository extends createRepository('player') {}
@Repository()
export class ScoreRepository extends createRepository('score') {}
@Repository()
export class ScorePlayerRepository extends createRepository('scorePlayer') {}
@Repository()
export class ScoreWorldRecordRepository extends createRepository('scoreWorldRecord') {}
@Repository()
export class UserRepository extends createRepository('user') {}

MAIN_INJECTOR.register([new ValueProvider(PrismaClient, new PrismaClient())]);
