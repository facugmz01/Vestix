import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
export declare class RedisService implements OnModuleInit, OnModuleDestroy {
    private redisClient;
    onModuleInit(): void;
    onModuleDestroy(): void;
    getClient(): Redis;
}
