#!/usr/bin/perl
# Copyright (C) 2025-2026 Elod Pal Csirmaz
# SPDX-License-Identifier: GPL-3.0-or-later

# Resize images for gifts

opendir my $dh, '.' or die $!;
my @files = readdir $dh;

foreach my $file (@files) {
    next if $file =~ /^\./;
    if($file =~ /\.(jpe?g|png)$/) {
        print("Converting $file\n");
        my $ext = $1;
        `convert "$file" -resize 600x900\\> "$file.new.$ext"`;
        rename($file.'.new.'.$ext, $file);
    }
}

