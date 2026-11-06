import { createKafkaConsumerConnection, createKafkaLogger } from "@repo/kafka";
import { env } from "../config/env";
import { logger } from "./logger";

export type { KafkaConsumer } from "@repo/kafka";

const consumerConnection = createKafkaConsumerConnection({
  connection: {
    clientId: env.KAFKA_CLIENT_ID,
    brokers: env.KAFKA_BROKERS,
    saslMechanism: env.KAFKA_SASL_MECHANISM,
    username: env.KAFKA_USERNAME,
    password: env.KAFKA_PASSWORD,
    caCertPath: env.KAFKA_CA_CERT_PATH,
  },
  kafkaLogger: createKafkaLogger(logger),
  groupId: env.KAFKA_CONSUMER_GROUP_ID,
  fromBeginning: env.KAFKA_CONSUMER_FROM_BEGINNING,
  topic: env.KAFKA_DEPLOYMENT_LOGS_TOPIC,
});

export const connectConsumer = consumerConnection.connect;
export const disconnectConsumer = consumerConnection.disconnect;
