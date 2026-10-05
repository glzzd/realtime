const errorMiddleware = (err, req, res, next) => {
    console.error(err)

    const statusCode = err.statusCode || 500
    res.status(statusCode).json({
        success: false,
        message: err.message || "Server xətası",
        errorCode: err.errorCode || "INTERNAL_SERVER_ERROR"
    })
}

module.exports = errorMiddleware