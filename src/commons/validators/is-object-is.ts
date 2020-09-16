import { ObjectId } from 'mongodb';

export async function isObjectId(val: any): Promise<ObjectId> {
  try {
    // TODO could return parsed ObjectId, but would require changes in controllers
    ObjectId.createFromHexString(val);
  } catch (e) {
    throw new Error('Not a valid ObjectId hex string');
  }
  return val;
}
