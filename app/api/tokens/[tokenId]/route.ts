import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/mongodb';
import { ProductBatch, ProductTemplate, Plant, BatchComponent } from '@/lib/models';
import { ObjectId } from 'mongodb';

interface TokenDetails {
  tokenId: number;
  batch: ProductBatch;
  product: ProductTemplate;
  plant: Plant;
  components?: ComponentDetails[];
  supplyChainLocations?: SupplyChainLocation[];
}

interface SupplyChainLocation {
  lat: number;
  lng: number;
  name: string;
  type: 'Manufacturing' | 'Raw Material' | 'Component' | 'Final Product';
  transport?: 'Road' | 'Sea' | 'Rail' | 'Air';
  carbonFootprint?: number;
  quantity?: number;
  parentLocation?: { lat: number; lng: number };
}

interface ComponentDetails {
  batch: ProductBatch;
  product: ProductTemplate;
  plant: Plant;
  components?: ComponentDetails[];
}

// Function to collect all plant locations from the supply chain
async function collectSupplyChainLocations(
  batch: ProductBatch,
  product: ProductTemplate,
  plant: Plant,
  components: ComponentDetails[],
  templatesCollection: any,
  plantsCollection: any
): Promise<SupplyChainLocation[]> {
  const locations: SupplyChainLocation[] = [];

  // Add the main product location
  if (plant.location?.coordinates) {
    locations.push({
      lat: plant.location.coordinates.latitude,
      lng: plant.location.coordinates.longitude,
      name: `${plant.plantName} - ${product.templateName}`,
      type: product.isRawMaterial ? 'Raw Material' : 'Final Product',
      carbonFootprint: batch.carbonFootprint / 1000,
      quantity: batch.quantity,
    });
  }

  // Recursively collect component locations
  for (const component of components) {
    if (component.plant.location?.coordinates) {
      const componentProduct = await templatesCollection.findOne({
        _id: new ObjectId(component.batch.templateId)
      });

      if (componentProduct) {
        const componentQuantity = batch.components?.find(c => c.tokenId === component.batch.tokenId)?.quantity || 0;
        const componentCO2 = (component.batch.carbonFootprint / 1000) * componentQuantity / component.batch.quantity;

        locations.push({
          lat: component.plant.location.coordinates.latitude,
          lng: component.plant.location.coordinates.longitude,
          name: `${component.plant.plantName} - ${componentProduct.templateName}`,
          type: componentProduct.isRawMaterial ? 'Raw Material' : 'Component',
          carbonFootprint: componentCO2,
          quantity: componentQuantity,
          parentLocation: plant.location?.coordinates ? {
            lat: plant.location.coordinates.latitude,
            lng: plant.location.coordinates.longitude
          } : undefined,
        });

        // Recursively add sub-component locations
        if (component.components && component.components.length > 0) {
          const subLocations = await collectSupplyChainLocationsRecursive(
            component.batch,
            componentProduct,
            component.plant,
            component.components,
            templatesCollection,
            plantsCollection
          );
          // Filter out duplicates and add new locations
          subLocations.forEach(subLoc => {
            const exists = locations.some(loc =>
              loc.lat === subLoc.lat && loc.lng === subLoc.lng && loc.name === subLoc.name
            );
            if (!exists) {
              locations.push(subLoc);
            }
          });
        }
      }
    }
  }

  return locations;
}

// Recursive function to collect sub-component locations with proper parent relationships
async function collectSupplyChainLocationsRecursive(
  batch: ProductBatch,
  product: ProductTemplate,
  plant: Plant,
  components: ComponentDetails[],
  templatesCollection: any,
  plantsCollection: any
): Promise<SupplyChainLocation[]> {
  const locations: SupplyChainLocation[] = [];

  // Recursively collect component locations
  for (const component of components) {
    if (component.plant.location?.coordinates) {
      const componentProduct = await templatesCollection.findOne({
        _id: new ObjectId(component.batch.templateId)
      });

      if (componentProduct) {
        const componentQuantity = batch.components?.find(c => c.tokenId === component.batch.tokenId)?.quantity || 0;
        const componentCO2 = (component.batch.carbonFootprint / 1000) * componentQuantity / component.batch.quantity;

        locations.push({
          lat: component.plant.location.coordinates.latitude,
          lng: component.plant.location.coordinates.longitude,
          name: `${component.plant.plantName} - ${componentProduct.templateName}`,
          type: componentProduct.isRawMaterial ? 'Raw Material' : 'Component',
          carbonFootprint: componentCO2,
          quantity: componentQuantity,
          parentLocation: plant.location?.coordinates ? {
            lat: plant.location.coordinates.latitude,
            lng: plant.location.coordinates.longitude
          } : undefined,
        });

        // Recursively add sub-component locations
        if (component.components && component.components.length > 0) {
          const subLocations = await collectSupplyChainLocationsRecursive(
            component.batch,
            componentProduct,
            component.plant,
            component.components,
            templatesCollection,
            plantsCollection
          );
          // Filter out duplicates and add new locations
          subLocations.forEach(subLoc => {
            const exists = locations.some(loc =>
              loc.lat === subLoc.lat && loc.lng === subLoc.lng && loc.name === subLoc.name
            );
            if (!exists) {
              locations.push(subLoc);
            }
          });
        }
      }
    }
  }

  return locations;
}

async function getTokenDetails(tokenId: number): Promise<TokenDetails | null> {
  try {
    await client.connect();
    const db = client.db('carbon-footprint');
    const batchesCollection = db.collection<ProductBatch>('productBatches');
    const templatesCollection = db.collection<ProductTemplate>('productTemplates');
    const plantsCollection = db.collection<Plant>('plants');

    // Find the batch by tokenId
    const batch = await batchesCollection.findOne({ tokenId: tokenId });
    if (!batch) {
      return null;
    }

    // Get product template
    const product = await templatesCollection.findOne({
      _id: new ObjectId(batch.templateId)
    });
    if (!product) {
      throw new Error(`Product template not found for templateId: ${batch.templateId}`);
    }

    // Get plant details
    const plant = await plantsCollection.findOne({
      _id: new ObjectId(batch.plantId)
    });
    if (!plant) {
      throw new Error(`Plant not found for plantId: ${batch.plantId}`);
    }

    const result: TokenDetails = {
      tokenId,
      batch,
      product,
      plant,
    };

    // Recursively get component details if this batch has components
    if (batch.components && batch.components.length > 0) {
      result.components = [];

      for (const component of batch.components) {
        const componentDetails = await getComponentDetails(component.tokenId, batchesCollection, templatesCollection, plantsCollection);
        if (componentDetails) {
          result.components.push(componentDetails);
        }
      }
    }

    // Collect supply chain locations for the map
    result.supplyChainLocations = await collectSupplyChainLocations(
      batch,
      product,
      plant,
      result.components || [],
      templatesCollection,
      plantsCollection
    );

    return result;
  } catch (error) {
    console.error('Error getting token details:', error);
    throw error;
  }
}

async function getComponentDetails(
  componentTokenId: number,
  batchesCollection: any,
  templatesCollection: any,
  plantsCollection: any
): Promise<ComponentDetails | null> {
  try {
    // Find the component batch
    const componentBatch = await batchesCollection.findOne({ tokenId: componentTokenId });
    if (!componentBatch) {
      console.warn(`Component batch not found for tokenId: ${componentTokenId}`);
      return null;
    }

    // Get component product template
    const componentProduct = await templatesCollection.findOne({
      _id: new ObjectId(componentBatch.templateId)
    });
    if (!componentProduct) {
      console.warn(`Component product template not found for templateId: ${componentBatch.templateId}`);
      return null;
    }

    // Get component plant
    const componentPlant = await plantsCollection.findOne({
      _id: new ObjectId(componentBatch.plantId)
    });
    if (!componentPlant) {
      console.warn(`Component plant not found for plantId: ${componentBatch.plantId}`);
      return null;
    }

    const componentDetails: ComponentDetails = {
      batch: componentBatch,
      product: componentProduct,
      plant: componentPlant,
    };

    // Recursively get sub-component details if this component has its own components
    if (componentBatch.components && componentBatch.components.length > 0) {
      componentDetails.components = [];

      for (const subComponent of componentBatch.components) {
        const subComponentDetails = await getComponentDetails(
          subComponent.tokenId,
          batchesCollection,
          templatesCollection,
          plantsCollection
        );
        if (subComponentDetails) {
          componentDetails.components.push(subComponentDetails);
        }
      }
    }

    return componentDetails;
  } catch (error) {
    console.error(`Error getting component details for tokenId ${componentTokenId}:`, error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId } = await params;
    const tokenIdNumber = parseInt(tokenId);

    if (isNaN(tokenIdNumber)) {
      return NextResponse.json(
        { error: 'Invalid token ID. Must be a number.' },
        { status: 400 }
      );
    }

    console.log(`Getting complete token details for tokenId: ${tokenIdNumber}`);

    const tokenDetails = await getTokenDetails(tokenIdNumber);

    if (!tokenDetails) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(tokenDetails, { status: 200 });

  } catch (error) {
    console.error('Error in token details API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token details' },
      { status: 500 }
    );
  }
}
