// SPDX-License-Identifier: MIT
// Author: ClubCards
// Developed by Max J. Rux
// Dev Twitter: @Rux_eth

pragma solidity ^0.8.0;

import "./ClubCards.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/utils/Context.sol";

import "hardhat/console.sol";

contract CCAuthTx is ERC1155Holder, Context {
    ClubCards public cc;

    constructor(ClubCards _cc) {
        cc = _cc;
    }

    function test(uint256 numMints, uint256 waveId) external payable {
        uint256 ti = cc.totalSupply();
        cc.mintCard{value: msg.value}(numMints, waveId);
        /* 
        if (numMints == 1) {
            cc.safeTransferFrom(address(this), _msgSender(), ti, 1, "");
        } else {
            (uint256[] memory arr1, uint256[] memory arr2) = arrayHelper(
                numMints,
                ti
            );
            cc.safeBatchTransferFrom(
                address(this),
                _msgSender(),
                arr1,
                arr2,
                ""
            );
            delete arr1;
            delete arr2;
        }
         */
        delete ti;
    }

    function arrayHelper(uint256 size, uint256 init)
        private
        pure
        returns (uint256[] memory arr1, uint256[] memory arr2)
    {
        arr1 = new uint256[](size);
        arr2 = new uint256[](size);
        for (uint256 i = init; i < size; i++) {
            arr1[i - init] = i;
            arr2[i - init] = 1;
        }
    }

    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) public virtual override returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) public virtual override returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }
}
