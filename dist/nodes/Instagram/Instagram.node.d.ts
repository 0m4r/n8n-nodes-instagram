import type { IExecuteFunctions, ILoadOptionsFunctions, INodeExecutionData, INodeListSearchResult, INodeType, INodeTypeDescription } from 'n8n-workflow';
export declare class Instagram implements INodeType {
    description: INodeTypeDescription;
    methods: {
        listSearch: {
            searchInstagramAccounts(this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult>;
        };
    };
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}
