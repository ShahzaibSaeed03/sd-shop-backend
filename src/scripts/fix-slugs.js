const mongoose = require('mongoose');
const Category = require('../modules/categorey/category.model'); // path adjust karo
const { slugify } = require('../utils/slugify');

// DB connect
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('DB connected'));

async function fixSlugs() {
  const categories = await Category.find({
    $or: [
      { slug: { $exists: false } },
      { slug: null },
      { slug: '' }
    ]
  });

  for (const cat of categories) {

    const baseSlug = slugify(cat.name);

    let slug = baseSlug;
    let count = 1;

    while (await Category.findOne({ slug })) {
      slug = `${baseSlug}-${count++}`;
    }

    cat.slug = slug;
    await cat.save();

    console.log(`✅ ${cat.name} → ${slug}`);
  }

  console.log('🔥 Slug migration complete');
  process.exit();
}

fixSlugs();