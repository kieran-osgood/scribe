{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
    buildInputs = with pkgs; [
        nodejs_20
        neovim
        nodePackages.pnpm
        turbo
    ];
}

