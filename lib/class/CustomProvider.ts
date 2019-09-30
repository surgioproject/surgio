import assert from 'assert';
import { CustomProviderConfig, PossibleNodeConfigType } from '../types';
import Provider from './Provider';

export default class CustomProvider extends Provider {
  public readonly nodeList: ReadonlyArray<PossibleNodeConfigType>;

  constructor(config: CustomProviderConfig) {
    super(config);
    assert(config.nodeList, 'Lack of nodeList.');
    this.nodeList = config.nodeList;
  }

  public async getNodeList(): Promise<ReadonlyArray<PossibleNodeConfigType>> {
    return this.nodeList;
  }
}
