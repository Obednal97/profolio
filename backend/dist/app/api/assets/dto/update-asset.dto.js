"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateAssetDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_asset_dto_1 = require("./create-asset.dto");
class UpdateAssetDto extends (0, swagger_1.PartialType)(create_asset_dto_1.CreateAssetDto) {
}
exports.UpdateAssetDto = UpdateAssetDto;
