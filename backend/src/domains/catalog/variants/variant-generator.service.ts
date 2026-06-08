import { Injectable } from '@nestjs/common';
import { GenerateVariantsDto } from './dto/generate-variants.dto';

@Injectable()
export class VariantGeneratorService {
  
  /**
   * Generates a cartesian product matrix of all provided attribute arrays.
   * Example: Size [S, M], Color [Red] -> [{Size: S, Color: Red}, {Size: M, Color: Red}]
   */
  public generateCombinations(dto: GenerateVariantsDto, productId: string, baseSku: string) {
    const { attributes, basePrice } = dto;
    
    // Extract labels and arrays for matrix multiplication
    const attributeNames = attributes.map(a => a.name);
    const attributeValuesLists = attributes.map(a => a.values);

    // Standard Cartesian Product reducer
    const cartesian = (...a: any[][]) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));
    
    // Handle edge case where a product only has 1 dimension (e.g., just "Size", no "Color")
    const combinations = attributeValuesLists.length === 1 
      ? attributeValuesLists[0].map(v => [v]) 
      : cartesian(...attributeValuesLists);

    return combinations.map(comboArray => {
      const attributesMap: Record<string, string> = {};
      let skuSuffix = '';

      comboArray.forEach((val, idx) => {
        const attrName = attributeNames[idx].toLowerCase();
        attributesMap[attrName] = val;
        
        // Build a deterministic SKU suffix. 
        // Example: Base = "Tee", Val = "Red" -> "Tee-RED"
        skuSuffix += `-${val.toString().toUpperCase().substring(0, 3)}`; 
      });

      return {
        productId,
        sku: `${baseSku}${skuSuffix}`,
        barcode: this.generateInternalBarcode(), 
        basePrice,
        attributes: attributesMap,
        isActive: true,
      };
    });
  }

  /**
   * Generates a 13-digit pseudo-EAN barcode for internal use if a manufacturer barcode isn't supplied.
   */
  private generateInternalBarcode(): string {
    const timestamp = Date.now().toString().slice(-9); // 9 digits
    const random = Math.floor(1000 + Math.random() * 9000); // 4 digits
    return `${timestamp}${random}`; // 13 digits total
  }
}
