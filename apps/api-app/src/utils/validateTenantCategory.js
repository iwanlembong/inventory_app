exports.validateTenantCategory =
    async (
        categoryId,
        tenantId
    ) => {

        const category =
            await prisma.category.findFirst({

                where: {

                    id: categoryId,

                    tenantId,

                },

            });

        if (!category) {

            throw new Error(
                "Category not found"
            );

        }

        return category;

    };