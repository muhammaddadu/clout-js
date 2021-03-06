/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */
module.exports = {
    httpResponseMap: {
        ok : {
            success: true,
            code: 200
        },
        success : {
            success: true,
            code: 200
        },
        created : {
            success: true,
            code: 201
        },
        accepted : {
            success: true,
            code: 202
        },
        badRequest : {
            success: false,
            code: 400,
            render: 'error/400',
        },
        notFound : {
            success: false,
            code: 404,
            render: 'error/404',
        },
        error : {
            success: false,
            code: 500,
            render: 'error/500',
        },
        unauthorized : {
            success: false,
            code: 401,
            render: 'error/401',
        }
    }
};
