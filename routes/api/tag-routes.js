const router = require('express').Router();
const { Tag, Product, ProductTag } = require('../../models');

// The `/api/tags` endpoint

router.get('/', async (req, res) => {
  // find all tags
  // be sure to include its associated Product data
  try {
    const tagData = await Tag.findAll({
      include: [{model: Product, through: ProductTag, as: 'tag_products'}]
    });
    res.status(200).json(tagData);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/:id', async (req, res) => {
  // find a single tag by its `id`
  // be sure to include its associated Product data
  try {
    const tagData = await Tag.findByPk(req.params.id, {
      include: [{model: Product, through: ProductTag, as: 'tag_products'}]
    });
    if (!tagData) {
      res.status(404).json({message: 'No tag found with this id'});
      return;
    }
    res.status(200).json(tagData);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.post('/', async (req, res) => {
  // create a new tag
  /* req.body
    {
      tag_name: "green",
      productIds: [1, 5, 6]
    }
  */
  Tag.create(req.body)
    .then((tag) => {
      if (req.body.productIds.length) {
        const tagProductIdArr = req.body.productIds.map((product_id) => {
          return {
            tag_id: tag.id,
            product_id
          };
        });
        return ProductTag.bulkCreate(tagProductIdArr);
      }
      res.status(200).json(tag);
    })
    .then((tagProductIds) => res.status(200).json(tagProductIds))
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});

router.put('/:id', async (req, res) => {
  // update a tag's name by its `id` value
  Tag.update(req.body, {
    where: {
      id: req.params.id
    }
  })
    .then((tag) => {
      return ProductTag.findAll({ where: {product_id: req.params.id } });
    })
    .then((tagProducts) => {
      const tagProductIds = tagProducts.map(({product_id}) => product_id);
      const newTagProducts = req.body.productIds
        .filter((product_id) => !tagProductIds.includes(product_id))
        .map((tag_id) => {
          return {
            tag_id: req.params.id,
            product_id
          };
        });
      const tagProductsToRemove = tagProducts
        .filter(({tag_id}) => !req.body.productIds.includes(product_id))
        .map(({id}) => id);

      return Promise.all([
        ProductTag.destroy({where: {id: tagProductsToRemove} }),
        ProductTag.bulkCreate(newTagProducts)
      ]);
    })
    .then((updatedTagProducts) => res.json(updatedTagProducts))
    .catch((err) => {
      res.status(400).json(err);
    });
});

router.delete('/:id', async (req, res) => {
  // delete on tag by its `id` value
  try {
    const tagData = await Tag.destroy({
      where: {
        id: req.params.id
      }
    });

    if (!tagData) {
      res.status(404).json({message: 'No tag found with this id'});
      return;
    }
    res.status(200).json(tagData);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
