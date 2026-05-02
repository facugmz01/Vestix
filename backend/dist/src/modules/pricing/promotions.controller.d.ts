export declare class PromotionsController {
    getPromotions(page: string, pageSize: string): {
        data: any[];
        total: number;
    };
    getConflicts(): {
        data: any[];
        total: number;
    };
}
