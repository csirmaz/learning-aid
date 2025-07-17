#!/usr/bin/perl

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

