import { supabase } from "./server/db";

async function fixDrinks() {
    console.log("Starting drink data fix...");

    // 1. Find the drinks with images and no branch
    const { data: drinksWithImages, error: fetchError } = await supabase
        .from('drinks')
        .select('*')
        .not('image_url', 'is', null);

    if (fetchError) {
        console.error("Error fetching drinks with images:", fetchError);
        return;
    }

    console.log(`Found ${drinksWithImages.length} drinks with images.`);

    // 2. Identify the main branch (usually ID 1 if it's the only one)
    const { data: branches, error: branchError } = await supabase.from('branches').select('id').order('id', { ascending: true }).limit(1);
    if (branchError || !branches || branches.length === 0) {
        console.error("Could not find a branch to assign drinks to.");
        return;
    }
    const defaultBranchId = branches[0].id;
    console.log(`Assigning drinks to branch ID: ${defaultBranchId}`);

    // 3. Update drinks with images to have this branch ID
    for (const drink of drinksWithImages) {
        const { error: updateError } = await supabase
            .from('drinks')
            .update({ branch_id: defaultBranchId })
            .eq('id', drink.id);

        if (updateError) {
            console.error(`Error updating drink ${drink.id}:`, updateError);
        } else {
            console.log(`Updated drink ${drink.id} (${drink.name}) with branch ID ${defaultBranchId}`);
        }
    }

    // 4. Delete the duplicate drinks that have NO images but have the branch ID
    const { error: deleteError } = await supabase
        .from('drinks')
        .delete()
        .eq('branch_id', defaultBranchId)
        .is('image_url', null);

    if (deleteError) {
        console.error("Error deleting duplicate drinks:", deleteError);
    } else {
        console.log("Deleted duplicate drinks (those without images).");
    }

    console.log("Fix completed.");
}

fixDrinks();
